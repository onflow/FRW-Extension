import { consoleError } from '@/shared/utils/console-log';

import fallback from '../assets/image/errorImage.png';

export const query2obj = (str: string) => {
  const res: Record<string, string> = {};
  str.replace(/([^=?#&]*)=([^?#&]*)/g, function (_, $1: string, $2: string) {
    res[decodeURIComponent($1)] = decodeURIComponent($2);
    return '';
  });
  return res;
};

export const obj2query = (obj: Record<string, string>) => {
  return Object.keys(obj)
    .map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    })
    .join('&');
};

export interface PostMedia {
  title: string;
  description: string;
  image: string;
  video: string;
}
export interface MatchMedia {
  url: string;
  title: string;
  description: string;
  type: MatchMediaType;
  videoURL: string | null;
  image?: string;
}

export enum MatchMediaType {
  IMAGE = 0,
  VIDEO = 1,
  AUDIO = 2,
}
export interface Metadata {
  name: string;
  value: string;
}

const proecessURL = (matches, blockList): string | null => {
  if (!matches) {
    return null;
  }

  if (matches.length > 0) {
    const matche = matches[0];
    let findurl = matche.uri;
    if (!findurl) {
      findurl = matche.value;
    }
    const url = findurl
      ?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
      .replace('https://ipfs.infura.io/ipfs', 'https://gateway.pinata.cloud/ipfs/');
    if (url === '' || url === undefined || !url.includes('.')) {
      return null;
    }

    const hostname = new URL(url)?.hostname;
    if (blockList && blockList.length > 0 && blockList.includes(hostname)) {
      return fallback;
    }
    return url;
  }
  return null;
};

export const findBestTitle = (props): string => {
  if (props.title && props.title !== '') {
    return props.title;
  }
  return `${props.contract.name} #${props.id.tokenId}`;
};

export const findBestDescription = (props): string => {
  if (props.description && props.description !== '') {
    return props.description;
  }
  return '';
};

const findVideo = (props, blockList): string | null => {
  let matches = [];
  let url: string | null = null;
  // Find Video
  matches = props.media.filter((res) => res.mimeType?.includes('video'));
  url = proecessURL(matches, blockList);
  if (url !== null) {
    return url;
  }

  matches = props.metadata.metadata.filter((item) => item.name?.includes('video'));
  url = proecessURL(matches, blockList);
  if (url !== null) {
    return url;
  }
  return null;
};

export const findBestMedia = async (props, blockList): Promise<MatchMedia> => {
  // Has media array
  try {
    let matches = [];
    let url: string | null = null;

    if (props.media && props.media.length > 0) {
      matches = props.media.filter((res) => res.mimeType?.includes('image'));
      url = proecessURL(matches, blockList);
      if (url !== null) {
        return {
          url: url,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: MatchMediaType.IMAGE,
          videoURL: findVideo(props, blockList),
        };
      }
    }

    matches = props.metadata.metadata.filter((item) => item.name?.includes('image'));
    url = proecessURL(matches, blockList);
    if (url !== null) {
      return {
        url: url,
        title: findBestTitle(props),
        description: findBestDescription(props),
        type: MatchMediaType.IMAGE,
        videoURL: findVideo(props, blockList),
      };
    }

    // handle only ipfs media in metadata
    matches = props.metadata.metadata.filter((item) => item.name === 'ipfs');
    if (matches && matches.length > 0) {
      const match: Metadata = matches[0];
      const url = 'https://ipfs.infura.io/ipfs/' + match.value;
      return {
        url: url,
        title: findBestTitle(props),
        description: findBestDescription(props),
        type: MatchMediaType.IMAGE,
        videoURL: findVideo(props, blockList),
      };
    }

    // Find Video
    matches = props.media.filter((res) => res.mimeType?.includes('video'));
    url = proecessURL(matches, blockList);
    if (url !== null) {
      return {
        url: url,
        title: findBestTitle(props),
        description: findBestDescription(props),
        type: MatchMediaType.VIDEO,
        videoURL: null,
      };
    }

    matches = props.metadata.metadata.filter((item) => item.name?.includes('video'));
    url = proecessURL(matches, blockList);
    if (url !== null) {
      return {
        url: url,
        title: findBestTitle(props),
        description: findBestDescription(props),
        type: MatchMediaType.VIDEO,
        videoURL: null,
      };
    }

    // Sepcial handling for MyNFT arlink
    matches = props.metadata.metadata.filter((item) => item.name?.includes('arLink'));
    if (matches && matches.length > 0) {
      const match: Metadata = matches[0];
      if (match.value !== '') {
        const url = 'https://arweave.net/' + match.value;
        return {
          url: url,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: props.media[0].mimeType.includes('image')
            ? MatchMediaType.IMAGE
            : MatchMediaType.VIDEO,
          videoURL: findVideo(props, blockList),
        };
      }
      matches = props.metadata.metadata.filter((item) => item.name?.includes('ipfsLink'));
      if (matches && matches.length > 0) {
        const match: Metadata = matches[0];
        if (match.value !== '') {
          return {
            url: match.value,
            title: findBestTitle(props),
            description: findBestDescription(props),
            type: MatchMediaType.IMAGE,
            videoURL: findVideo(props, blockList),
          };
        }
      }
    }

    // Handle starly card image
    // props.contract.address === '0x5b82f21c0edf76e3' &&
    if (props.contract.name === 'StarlyCard') {
      const response = await fetch(
        `https://bay-api.blocto.app/bloctoBay/nfts/starly/${props.id.tokenId}`
      );
      const json = await response.json();

      if (json.preview_image !== '') {
        return {
          url: json.preview_image,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: MatchMediaType.IMAGE,
          videoURL: findVideo(props, blockList),
        };
      }

      if (json.media_url !== '') {
        return {
          url: json.media_url,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: json.media_type === 'image' ? MatchMediaType.IMAGE : MatchMediaType.VIDEO,
          videoURL: null,
        };
      }
    }

    // Handle MusicBlock
    // props.contract.address === '0x5634aefcb76e7d8c' &&
    if (props.contract.name === 'MusicBlock') {
      const infoURL = props.tokenUri.raw;
      if (infoURL && infoURL !== '') {
        const response = await fetch(infoURL);
        const json = await response.json();
        return {
          url: json.image,
          title: json.name,
          description: json.description,
          type: MatchMediaType.AUDIO,
          videoURL: null,
        };
      }
    }

    // Handle Topshot
    // props.contract.address === '0x0b2a3299cc857e29' &&
    if (props.contract.name === 'TopShot') {
      const response = await fetch(
        `https://bay-api.blocto.app/bloctoBay/nfts/topShot/${props.id.tokenId}`
      );
      const json = await response.json();
      if (json.preview_image !== '') {
        return {
          url: json.preview_image,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: MatchMediaType.IMAGE,
          videoURL: json.media_url,
        };
      }

      if (json.media_url !== '') {
        return {
          url: json.media_url,
          title: findBestTitle(props),
          description: findBestDescription(props),
          type: json.media_type === 'image' ? MatchMediaType.IMAGE : MatchMediaType.VIDEO,
          videoURL: json.media_url,
        };
      }
    }

    // Handle BnGNFT
    // props.contract.address === '0x7859c48816bfea3c' &&
    if (props.contract.name === 'BnGNFT') {
      const infoURL = props.externalDomainViewUrl;
      const response = await fetch(infoURL);
      const json = await response.json();
      if (json.media_type === 'image') {
        return {
          url: json.url,
          title: json.name,
          description: json.description,
          type: MatchMediaType.IMAGE,
          videoURL: null,
        };
      }

      if (json.media_type.includes('video')) {
        return {
          url: json.url,
          title: json.name,
          description: json.description,
          type: MatchMediaType.VIDEO,
          videoURL: json.url,
        };
      }
    }

    // Handle FLOAT
    // props.contract.address === '0x2d4c3caffbeab845' &&
    if (props.contract.name === 'FLOAT') {
      const url = 'https://ipfs.infura.io/ipfs/' + props.media[0].uri;
      return {
        url: url,
        title: findBestTitle(props),
        description: findBestDescription(props),
        type: MatchMediaType.IMAGE,
        videoURL: null,
      };
    }

    return {
      url: fallback,
      title: findBestTitle(props),
      description: findBestDescription(props),
      type: MatchMediaType.IMAGE,
      videoURL: null,
    };
  } catch (e) {
    consoleError('Failed to find NFT media', e);
    return {
      url: fallback,
      title: findBestTitle(props),
      description: findBestDescription(props),
      type: MatchMediaType.IMAGE,
      videoURL: null,
    };
  }
};
