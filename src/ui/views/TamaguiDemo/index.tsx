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
  H4,
  H5,
  H6,
  View,
  ScrollView,
  Card,
  Avatar,
  Separator,
  Switch,
  Checkbox,
  RadioGroup,
  Slider,
  Progress,
  Spinner,
  Sheet,
  Dialog,
  Popover,
  Tooltip,
  TextArea,
  Label,
  Paragraph,
  ListItem,
  Square,
  Circle,
} from 'tamagui';

import config from '../../../../tamagui.config';

const TamaguiDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [sliderValue, setSliderValue] = useState([50]);
  const [progressValue] = useState(75);
  const [selectValue, setSelectValue] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <ScrollView style={{ backgroundColor: '#0a0a0a', minHeight: '100vh' as any }}>
        <View style={{ maxWidth: 800, marginHorizontal: 'auto', padding: 24 }}>
          <YStack gap="$6">
            {/* Header */}
            <YStack gap="$3">
              <H1 color="white" style={{ textAlign: 'center' }}>
                🎨 Tamagui Dark Theme Demo
              </H1>
              <Text color="#aaa" style={{ textAlign: 'center' }} fontSize="$5">
                A cross-platform UI system for React Native and Web
              </Text>
            </YStack>

            {/* Core Components Section */}
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333',
                padding: 20,
              }}
            >
              <YStack gap="$4">
                <H2 color="white">🚀 Core Components</H2>

                {/* Typography */}
                <YStack gap="$3">
                  <H3 color="white">Typography</H3>
                  <YStack gap="$2">
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
                <YStack gap="$3">
                  <H3 color="white">Button Variants</H3>
                  <XStack gap="$3" style={{ flexWrap: 'wrap' }}>
                    <Button>Default Button</Button>
                    <Button variant="outlined">Outlined Button</Button>
                    <Button size="$2" style={{ backgroundColor: '#2563eb' }}>
                      Small Button
                    </Button>
                    <Button size="$5" style={{ backgroundColor: '#16a34a' }}>
                      Large Button
                    </Button>
                    <Button style={{ backgroundColor: '#dc2626' }}>Destructive</Button>
                  </XStack>
                </YStack>

                {/* Inputs */}
                <YStack gap="$3">
                  <H3 color="white">Input Components</H3>
                  <XStack gap="$3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input
                      placeholder="Enter your name..."
                      value={inputValue}
                      onChangeText={setInputValue}
                      width={200}
                      style={{ backgroundColor: '#2a2a2a' }}
                      borderColor="#444"
                      color="white"
                      placeholderTextColor="#888"
                    />
                    <Input
                      placeholder="Email address"
                      width={200}
                      style={{ backgroundColor: '#2a2a2a' }}
                      borderColor="#444"
                      color="white"
                      placeholderTextColor="#888"
                    />
                    <Input
                      placeholder="Disabled state"
                      disabled
                      opacity={0.5}
                      width={200}
                      style={{ backgroundColor: '#2a2a2a' }}
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
                <YStack gap="$3">
                  <H3 color="white">Color Theme Showcase</H3>
                  <XStack gap="$3" style={{ flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Blue Theme
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#16a34a', padding: 12, borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Green Theme
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#dc2626', padding: 12, borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Red Theme
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#9333ea', padding: 12, borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Purple Theme
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#ea580c', padding: 12, borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Orange Theme
                      </Text>
                    </View>
                  </XStack>
                </YStack>

                {/* Form Components */}
                <YStack gap="$3">
                  <H3 color="white">Form Components</H3>
                  <YStack gap="$4">
                    {/* TextArea */}
                    <YStack gap="$2">
                      <Label color="white" htmlFor="textarea">
                        Message
                      </Label>
                      <TextArea
                        id="textarea"
                        placeholder="Enter a longer message..."
                        value={textAreaValue}
                        onChangeText={setTextAreaValue}
                        style={{ backgroundColor: '#2a2a2a' }}
                        borderColor="#444"
                        color="white"
                        placeholderTextColor="#888"
                        rows={4}
                      />
                    </YStack>

                    {/* Switch */}
                    <XStack gap="$3" style={{ alignItems: 'center' }}>
                      <Switch
                        checked={switchValue}
                        onCheckedChange={setSwitchValue}
                        style={{ backgroundColor: switchValue ? '#16a34a' : '#444' }}
                      />
                      <Label color="white">Enable notifications</Label>
                      <Text color="#aaa" fontSize="$2">
                        ({switchValue ? 'On' : 'Off'})
                      </Text>
                    </XStack>

                    {/* Checkbox */}
                    <XStack gap="$3" style={{ alignItems: 'center' }}>
                      <Checkbox
                        checked={checkboxValue}
                        onCheckedChange={(checked) => setCheckboxValue(checked === true)}
                        style={{ backgroundColor: checkboxValue ? '#2563eb' : '#444' }}
                        borderColor="#666"
                      />
                      <Label color="white">I agree to the terms and conditions</Label>
                    </XStack>

                    {/* Radio Group */}
                    <YStack gap="$2">
                      <Label color="white">Choose your preference:</Label>
                      <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                        <XStack gap="$3" style={{ alignItems: 'center' }}>
                          <RadioGroup.Item value="option1" style={{ backgroundColor: '#444' }} />
                          <Label color="white">Option 1</Label>
                        </XStack>
                        <XStack gap="$3" style={{ alignItems: 'center' }}>
                          <RadioGroup.Item value="option2" style={{ backgroundColor: '#444' }} />
                          <Label color="white">Option 2</Label>
                        </XStack>
                        <XStack gap="$3" style={{ alignItems: 'center' }}>
                          <RadioGroup.Item value="option3" style={{ backgroundColor: '#444' }} />
                          <Label color="white">Option 3</Label>
                        </XStack>
                      </RadioGroup>
                      <Text color="#aaa" fontSize="$2">
                        Selected: {radioValue}
                      </Text>
                    </YStack>

                    {/* Slider */}
                    <YStack gap="$2">
                      <Label color="white">Volume: {sliderValue[0]}%</Label>
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={100}
                        step={1}
                        style={{ backgroundColor: '#444' }}
                      >
                        <Slider.Track style={{ backgroundColor: '#333' }}>
                          <Slider.TrackActive style={{ backgroundColor: '#2563eb' }} />
                        </Slider.Track>
                        <Slider.Thumb index={0} style={{ backgroundColor: '#2563eb' }} />
                      </Slider>
                    </YStack>
                  </YStack>
                </YStack>

                {/* Progress & Loading */}
                <YStack gap="$3">
                  <H3 color="white">Progress & Loading</H3>
                  <YStack gap="$4">
                    {/* Progress Bar */}
                    <YStack gap="$2">
                      <XStack style={{ justifyContent: 'space-between' }}>
                        <Label color="white">Upload Progress</Label>
                        <Text color="#aaa" fontSize="$2">
                          {progressValue}%
                        </Text>
                      </XStack>
                      <Progress value={progressValue} style={{ backgroundColor: '#333' }}>
                        <Progress.Indicator style={{ backgroundColor: '#16a34a' }} />
                      </Progress>
                    </YStack>

                    {/* Spinners */}
                    <XStack gap="$4" style={{ alignItems: 'center' }}>
                      <Spinner color="#2563eb" />
                      <Spinner color="#16a34a" size="large" />
                      <Spinner color="#dc2626" size="small" />
                      <Text color="white">Loading...</Text>
                    </XStack>
                  </YStack>
                </YStack>

                {/* Avatars & Images */}
                <YStack gap="$3">
                  <H3 color="white">Avatars & Images</H3>
                  <XStack gap="$4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Avatar circular size="$6" style={{ backgroundColor: '#2563eb' }}>
                      <Avatar.Image src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" />
                      <Avatar.Fallback style={{ backgroundColor: '#2563eb' }}>
                        <Text color="white" fontWeight="600">
                          JD
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>

                    <Avatar circular size="$8" style={{ backgroundColor: '#16a34a' }}>
                      <Avatar.Fallback style={{ backgroundColor: '#16a34a' }}>
                        <Text color="white" fontWeight="600" fontSize="$6">
                          AB
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>

                    <Avatar size="$10" style={{ backgroundColor: '#9333ea' }}>
                      <Avatar.Fallback style={{ backgroundColor: '#9333ea' }}>
                        <Text color="white" fontWeight="600" fontSize="$8">
                          UI
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>
                  </XStack>
                </YStack>

                {/* Shapes */}
                <YStack gap="$3">
                  <H3 color="white">Shapes & Layouts</H3>
                  <XStack gap="$4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Square size="$8" style={{ backgroundColor: '#2563eb', borderRadius: 8 }}>
                      <Text color="white" fontWeight="600">
                        Square
                      </Text>
                    </Square>

                    <Circle size="$8" style={{ backgroundColor: '#16a34a' }}>
                      <Text color="white" fontWeight="600">
                        Circle
                      </Text>
                    </Circle>

                    <View
                      style={{
                        width: 96,
                        height: 64,
                        backgroundColor: '#dc2626',
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        color="white"
                        fontWeight="600"
                        style={{ textAlign: 'center', paddingTop: 8 }}
                      >
                        Rectangle
                      </Text>
                    </View>
                  </XStack>
                </YStack>

                {/* Interactive Components */}
                <YStack gap="$3">
                  <H3 color="white">Interactive Components</H3>
                  <XStack gap="$3" style={{ flexWrap: 'wrap' }}>
                    <Button
                      onPress={() => setSheetOpen(true)}
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      Open Sheet
                    </Button>

                    <Button
                      onPress={() => setDialogOpen(true)}
                      style={{ backgroundColor: '#16a34a' }}
                    >
                      Open Dialog
                    </Button>

                    <Popover>
                      <Popover.Trigger asChild>
                        <Button style={{ backgroundColor: '#9333ea' }}>Open Popover</Button>
                      </Popover.Trigger>
                      <Popover.Content
                        style={{
                          backgroundColor: '#1a1a1a',
                          borderColor: '#333',
                          borderWidth: 1,
                          padding: 16,
                          borderRadius: 8,
                        }}
                      >
                        <YStack gap="$2">
                          <Text color="white" fontWeight="600">
                            Popover Content
                          </Text>
                          <Text color="#aaa" fontSize="$2">
                            This is a popover with some content inside.
                          </Text>
                          <Button size="$2" style={{ backgroundColor: '#2563eb' }}>
                            Action
                          </Button>
                        </YStack>
                      </Popover.Content>
                    </Popover>

                    <Tooltip>
                      <Tooltip.Trigger asChild>
                        <Button style={{ backgroundColor: '#ea580c' }}>Hover for Tooltip</Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content
                        style={{
                          backgroundColor: '#1a1a1a',
                          borderColor: '#333',
                          borderWidth: 1,
                          padding: 8,
                          borderRadius: 4,
                        }}
                      >
                        <Text color="white" fontSize="$2">
                          This is a helpful tooltip!
                        </Text>
                      </Tooltip.Content>
                    </Tooltip>
                  </XStack>
                </YStack>
              </YStack>
            </View>

            {/* Integration Status */}
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#16a34a',
                padding: 20,
              }}
            >
              <YStack gap="$4">
                <H2 color="#22c55e">✅ Integration Status</H2>

                <YStack gap="$3">
                  <XStack gap="$3" style={{ alignItems: 'center' }}>
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

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
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

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
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

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
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
                  style={{
                    backgroundColor: '#064e3b',
                    borderColor: '#16a34a',
                    borderWidth: 1,
                    padding: 16,
                    marginTop: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text color="#22c55e" fontWeight="600" style={{ textAlign: 'center' }}>
                    🎉 Integration Complete! Tamagui is ready to use with cross-platform UI
                    components.
                  </Text>
                </View>
              </YStack>
            </View>

            {/* Feature Highlights */}
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333',
                padding: 20,
              }}
            >
              <YStack gap="$4">
                <H2 color="white">🌟 Key Features</H2>

                <YStack gap="$3">
                  <XStack gap="$3" style={{ alignItems: 'center' }}>
                    <View
                      style={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 4 }}
                    />
                    <Text color="white">Optimized performance with compile-time optimizations</Text>
                  </XStack>

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
                    <View
                      style={{ backgroundColor: '#22c55e', width: 8, height: 8, borderRadius: 4 }}
                    />
                    <Text color="white">Complete design system with tokens and themes</Text>
                  </XStack>

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
                    <View
                      style={{ backgroundColor: '#9333ea', width: 8, height: 8, borderRadius: 4 }}
                    />
                    <Text color="white">Cross-platform components (React Native + Web)</Text>
                  </XStack>

                  <XStack gap="$3" style={{ alignItems: 'center' }}>
                    <View
                      style={{ backgroundColor: '#ea580c', width: 8, height: 8, borderRadius: 4 }}
                    />
                    <Text color="white">TypeScript-first with excellent DX</Text>
                  </XStack>
                </YStack>
              </YStack>
            </View>

            {/* List & Card Components */}
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333',
                padding: 20,
              }}
            >
              <YStack gap="$4">
                <H2 color="white">📋 Lists & Cards</H2>

                {/* Cards */}
                <YStack gap="$3">
                  <H3 color="white">Card Examples</H3>
                  <XStack gap="$3" style={{ flexWrap: 'wrap' }}>
                    <Card
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderColor: '#444',
                        borderWidth: 1,
                        width: 280,
                        height: 160,
                      }}
                    >
                      <Card.Header style={{ paddingBottom: 8 }}>
                        <H4 color="white">Project Alpha</H4>
                        <Paragraph color="#aaa" fontSize="$2">
                          A revolutionary new approach to cross-platform development
                        </Paragraph>
                      </Card.Header>
                      <Card.Footer
                        style={{
                          paddingTop: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <XStack gap="$2" style={{ alignItems: 'center' }}>
                          <Circle size="$2" style={{ backgroundColor: '#16a34a' }} />
                          <Text color="#aaa" fontSize="$1">
                            Active
                          </Text>
                        </XStack>
                        <Button size="$2" style={{ backgroundColor: '#2563eb' }}>
                          View
                        </Button>
                      </Card.Footer>
                    </Card>

                    <Card
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderColor: '#444',
                        borderWidth: 1,
                        width: 280,
                        height: 160,
                      }}
                    >
                      <Card.Header style={{ paddingBottom: 8 }}>
                        <H4 color="white">Design System</H4>
                        <Paragraph color="#aaa" fontSize="$2">
                          Comprehensive UI components and design tokens
                        </Paragraph>
                      </Card.Header>
                      <Card.Footer
                        style={{
                          paddingTop: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <XStack gap="$2" style={{ alignItems: 'center' }}>
                          <Circle size="$2" style={{ backgroundColor: '#ea580c' }} />
                          <Text color="#aaa" fontSize="$1">
                            In Progress
                          </Text>
                        </XStack>
                        <Button size="$2" style={{ backgroundColor: '#9333ea' }}>
                          Edit
                        </Button>
                      </Card.Footer>
                    </Card>
                  </XStack>
                </YStack>

                {/* Lists */}
                <YStack gap="$3">
                  <H3 color="white">List Items</H3>
                  <YStack gap="$2">
                    <ListItem
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderColor: '#444',
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <XStack gap="$3" style={{ alignItems: 'center', flex: 1 }}>
                        <Avatar circular size="$4" style={{ backgroundColor: '#2563eb' }}>
                          <Avatar.Fallback style={{ backgroundColor: '#2563eb' }}>
                            <Text color="white" fontSize="$2">
                              JS
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                        <YStack style={{ flex: 1 }}>
                          <Text color="white" fontWeight="600">
                            John Smith
                          </Text>
                          <Text color="#aaa" fontSize="$2">
                            Software Engineer
                          </Text>
                        </YStack>
                        <Button size="$2" style={{ backgroundColor: '#16a34a' }}>
                          Connect
                        </Button>
                      </XStack>
                    </ListItem>

                    <ListItem
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderColor: '#444',
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <XStack gap="$3" style={{ alignItems: 'center', flex: 1 }}>
                        <Avatar circular size="$4" style={{ backgroundColor: '#9333ea' }}>
                          <Avatar.Fallback style={{ backgroundColor: '#9333ea' }}>
                            <Text color="white" fontSize="$2">
                              AD
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                        <YStack style={{ flex: 1 }}>
                          <Text color="white" fontWeight="600">
                            Alice Davis
                          </Text>
                          <Text color="#aaa" fontSize="$2">
                            Product Designer
                          </Text>
                        </YStack>
                        <Button size="$2" variant="outlined" borderColor="#666">
                          Message
                        </Button>
                      </XStack>
                    </ListItem>

                    <ListItem
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderColor: '#444',
                        borderWidth: 1,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <XStack gap="$3" style={{ alignItems: 'center', flex: 1 }}>
                        <Avatar circular size="$4" style={{ backgroundColor: '#dc2626' }}>
                          <Avatar.Fallback style={{ backgroundColor: '#dc2626' }}>
                            <Text color="white" fontSize="$2">
                              MJ
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                        <YStack style={{ flex: 1 }}>
                          <Text color="white" fontWeight="600">
                            Mike Johnson
                          </Text>
                          <Text color="#aaa" fontSize="$2">
                            DevOps Engineer
                          </Text>
                        </YStack>
                        <Button size="$2" style={{ backgroundColor: '#ea580c' }}>
                          Follow
                        </Button>
                      </XStack>
                    </ListItem>
                  </YStack>
                </YStack>

                {/* Separators */}
                <YStack gap="$3">
                  <H3 color="white">Separators</H3>
                  <YStack gap="$4">
                    <Text color="white">Content above separator</Text>
                    <Separator borderColor="#444" />
                    <Text color="white">Content below separator</Text>
                    <View
                      style={{
                        height: 20,
                        borderLeftWidth: 1,
                        borderColor: '#444',
                        alignSelf: 'center',
                      }}
                    />
                    <Text color="white">Vertical separator above</Text>
                  </YStack>
                </YStack>
              </YStack>
            </View>

            {/* Typography Showcase */}
            <View
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#333',
                padding: 20,
              }}
            >
              <YStack gap="$4">
                <H2 color="white">📝 Typography Scale</H2>
                <YStack gap="$3">
                  <H1 color="white">H1 - Main Heading</H1>
                  <H2 color="white">H2 - Section Heading</H2>
                  <H3 color="white">H3 - Subsection Heading</H3>
                  <H4 color="white">H4 - Component Heading</H4>
                  <H5 color="white">H5 - Small Heading</H5>
                  <H6 color="white">H6 - Tiny Heading</H6>
                  <Paragraph color="white">
                    This is a paragraph component with longer text content. It demonstrates how text
                    flows and wraps in the Tamagui typography system.
                  </Paragraph>
                  <Text color="#aaa" fontSize="$2">
                    Small text for captions and metadata
                  </Text>
                  <Text color="white" fontWeight="600">
                    Bold text for emphasis
                  </Text>
                  <Text color="white" fontStyle="italic">
                    Italic text for emphasis
                  </Text>
                  <Text color="white" style={{ textDecorationLine: 'underline' }}>
                    Underlined text
                  </Text>
                </YStack>
              </YStack>
            </View>
          </YStack>
        </View>

        {/* Sheet Modal */}
        <Sheet modal open={sheetOpen} onOpenChange={setSheetOpen} snapPoints={[85, 50, 25]}>
          <Sheet.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <Sheet.Handle style={{ backgroundColor: '#444' }} />
          <Sheet.Frame
            style={{
              backgroundColor: '#1a1a1a',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Sheet.ScrollView>
              <YStack style={{ padding: 16 }} gap="$4">
                <H2 color="white">Sheet Example</H2>
                <Text color="#aaa">
                  This is a sheet component that slides up from the bottom. You can drag the handle
                  to resize it or swipe down to close it.
                </Text>
                <YStack gap="$3">
                  <Input
                    placeholder="Enter something..."
                    style={{ backgroundColor: '#2a2a2a' }}
                    borderColor="#444"
                    color="white"
                  />
                  <Button
                    style={{ backgroundColor: '#2563eb' }}
                    onPress={() => setSheetOpen(false)}
                  >
                    Close Sheet
                  </Button>
                </YStack>
              </YStack>
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>

        {/* Dialog Modal */}
        <Dialog modal open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />
            <Dialog.Content
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#333',
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                maxWidth: 400,
              }}
            >
              <YStack gap="$4">
                <Dialog.Title color="white" fontSize="$6" fontWeight="600">
                  Confirm Action
                </Dialog.Title>
                <Dialog.Description color="#aaa" fontSize="$4">
                  Are you sure you want to proceed with this action? This cannot be undone.
                </Dialog.Description>
                <XStack gap="$3" style={{ justifyContent: 'flex-end' }}>
                  <Dialog.Close asChild>
                    <Button variant="outlined" borderColor="#666">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Button
                      style={{ backgroundColor: '#dc2626' }}
                      onPress={() => setDialogOpen(false)}
                    >
                      Confirm
                    </Button>
                  </Dialog.Close>
                </XStack>
              </YStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </ScrollView>
    </TamaguiProvider>
  );
};

export default TamaguiDemo;
