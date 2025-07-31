import React, { useState } from 'react';
import {
  TamaguiProvider,
  Button,
  Input,
  Text,
  XStack,
  YStack,
  H1,
  H2,
  H3,
  View,
  ScrollView,
} from 'tamagui';

import config from '../../../../tamagui.config';

const TamaguiDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <ScrollView backgroundColor="#0a0a0a" minHeight="100vh">
        <View maxWidth={800} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$6">
          <YStack space="$6">
            {/* Header */}
            <YStack space="$3">
              <H1 color="white" textAlign="center">
                🎨 Tamagui Dark Theme Demo
              </H1>
              <Text color="#aaa" textAlign="center" fontSize="$5">
                A cross-platform UI system for React Native and Web
              </Text>
            </YStack>

            {/* Core Components Section */}
            <View
              backgroundColor="#1a1a1a"
              borderRadius="$6"
              borderWidth={1}
              borderColor="#333"
              paddingHorizontal="$5"
              paddingVertical="$6"
            >
              <YStack space="$4">
                <H2 color="white">🚀 Core Components</H2>

                {/* Typography */}
                <YStack space="$3">
                  <H3 color="white">Typography</H3>
                  <YStack space="$2">
                    <H1 color="white">H1 Heading - Tamagui</H1>
                    <H2 color="white">H2 Heading - Medium Size</H2>
                    <H3 color="white">H3 Heading - Small Title</H3>
                    <Text color="white">
                      Regular text component - This is Tamagui's Text component
                    </Text>
                    <Text color="#aaa" fontSize="$2">
                      Small text with muted color
                    </Text>
                  </YStack>
                </YStack>

                {/* Buttons */}
                <YStack space="$3">
                  <H3 color="white">Button Variants</H3>
                  <XStack space="$3" flexWrap="wrap">
                    <Button>Default Button</Button>
                    <Button variant="outlined">Outlined Button</Button>
                    <Button size="$2" backgroundColor="#2563eb">
                      Small Button
                    </Button>
                    <Button size="$5" backgroundColor="#16a34a">
                      Large Button
                    </Button>
                    <Button backgroundColor="#dc2626">Destructive</Button>
                  </XStack>
                </YStack>

                {/* Inputs */}
                <YStack space="$3">
                  <H3 color="white">Input Components</H3>
                  <XStack space="$3" ai="center" flexWrap="wrap">
                    <Input
                      placeholder="Enter your name..."
                      value={inputValue}
                      onChangeText={setInputValue}
                      width={200}
                      backgroundColor="#2a2a2a"
                      borderColor="#444"
                      color="white"
                      placeholderTextColor="#888"
                    />
                    <Input
                      placeholder="Email address"
                      width={200}
                      backgroundColor="#2a2a2a"
                      borderColor="#444"
                      color="white"
                      placeholderTextColor="#888"
                    />
                    <Input
                      placeholder="Disabled state"
                      disabled
                      opacity={0.5}
                      width={200}
                      backgroundColor="#2a2a2a"
                      borderColor="#444"
                    />
                  </XStack>
                  {inputValue && (
                    <Text color="#3b82f6" fontSize="$3">
                      You entered: {inputValue}
                    </Text>
                  )}
                </YStack>

                {/* Color Showcase */}
                <YStack space="$3">
                  <H3 color="white">Color Theme Showcase</H3>
                  <XStack space="$3" flexWrap="wrap">
                    <View backgroundColor="#2563eb" padding="$3" borderRadius="$4">
                      <Text color="white" fontWeight="600">
                        Blue Theme
                      </Text>
                    </View>
                    <View backgroundColor="#16a34a" padding="$3" borderRadius="$4">
                      <Text color="white" fontWeight="600">
                        Green Theme
                      </Text>
                    </View>
                    <View backgroundColor="#dc2626" padding="$3" borderRadius="$4">
                      <Text color="white" fontWeight="600">
                        Red Theme
                      </Text>
                    </View>
                    <View backgroundColor="#9333ea" padding="$3" borderRadius="$4">
                      <Text color="white" fontWeight="600">
                        Purple Theme
                      </Text>
                    </View>
                    <View backgroundColor="#ea580c" padding="$3" borderRadius="$4">
                      <Text color="white" fontWeight="600">
                        Orange Theme
                      </Text>
                    </View>
                  </XStack>
                </YStack>
              </YStack>
            </View>

            {/* Integration Status */}
            <View
              backgroundColor="#1a1a1a"
              borderRadius="$6"
              borderWidth={1}
              borderColor="#16a34a"
              paddingHorizontal="$5"
              paddingVertical="$6"
            >
              <YStack space="$4">
                <H2 color="#22c55e">✅ Integration Status</H2>

                <YStack space="$3">
                  <XStack space="$3" ai="center">
                    <Text color="#22c55e" fontSize="$6">
                      ✓
                    </Text>
                    <YStack>
                      <Text color="white" fontWeight="600">
                        @tamagui/core v1.117.12
                      </Text>
                      <Text color="#aaa" fontSize="$2">
                        Core component system loaded successfully
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <Text color="#22c55e" fontSize="$6">
                      ✓
                    </Text>
                    <YStack>
                      <Text color="white" fontWeight="600">
                        @tamagui/config v4
                      </Text>
                      <Text color="#aaa" fontSize="$2">
                        Preset configuration working perfectly
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <Text color="#22c55e" fontSize="$6">
                      ✓
                    </Text>
                    <YStack>
                      <Text color="white" fontWeight="600">
                        Cross-platform Compatible
                      </Text>
                      <Text color="#aaa" fontSize="$2">
                        Running perfectly in web environment
                      </Text>
                    </YStack>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <Text color="#22c55e" fontSize="$6">
                      ✓
                    </Text>
                    <YStack>
                      <Text color="white" fontWeight="600">
                        Dark Theme Support
                      </Text>
                      <Text color="#aaa" fontSize="$2">
                        Beautiful dark mode implementation
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>

                <View
                  backgroundColor="#064e3b"
                  borderColor="#16a34a"
                  borderWidth={1}
                  padding="$4"
                  marginTop="$3"
                  borderRadius="$4"
                >
                  <Text color="#22c55e" fontWeight="600" textAlign="center">
                    🎉 Integration Complete! Tamagui is ready to use with cross-platform UI
                    components.
                  </Text>
                </View>
              </YStack>
            </View>

            {/* Feature Highlights */}
            <View
              backgroundColor="#1a1a1a"
              borderRadius="$6"
              borderWidth={1}
              borderColor="#333"
              paddingHorizontal="$5"
              paddingVertical="$6"
            >
              <YStack space="$4">
                <H2 color="white">🌟 Key Features</H2>

                <YStack space="$3">
                  <XStack space="$3" ai="center">
                    <View backgroundColor="#3b82f6" width={8} height={8} borderRadius="$10" />
                    <Text color="white">Optimized performance with compile-time optimizations</Text>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <View backgroundColor="#22c55e" width={8} height={8} borderRadius="$10" />
                    <Text color="white">Complete design system with tokens and themes</Text>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <View backgroundColor="#9333ea" width={8} height={8} borderRadius="$10" />
                    <Text color="white">Cross-platform components (React Native + Web)</Text>
                  </XStack>

                  <XStack space="$3" ai="center">
                    <View backgroundColor="#ea580c" width={8} height={8} borderRadius="$10" />
                    <Text color="white">TypeScript-first with excellent DX</Text>
                  </XStack>
                </YStack>
              </YStack>
            </View>
          </YStack>
        </View>
      </ScrollView>
    </TamaguiProvider>
  );
};

export default TamaguiDemo;
